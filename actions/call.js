"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "../lib/prisma";
import { StreamClient } from "@stream-io/node-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

export const getCallData = async (callId) => {
  const user = await currentUser();
  if (!user) return { error: "Unauthorized" };

  const booking = await db.booking.findUnique({
    where: { streamCallId: callId },
    include: {
      interviewer: {
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          imageUrl: true,
          categories: true,
        },
      },
      interviewee: {
        select: {
          id: true,
          clerkUserId: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!booking) return { error: "call not found" };

  const isInterviewer = booking.interviewer.clerkUserId === user.id;
  const isInterviewee = booking.interviewee.clerkUserId === user.id;
  if (!isInterviewer && !isInterviewee) return { error: "Forbidden" };

  const streamClient = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_KEY,
    process.env.STREAM_SECRET_KEY,
  );

  const token = streamClient.generateUserToken({
    user_id: user.id,
    validity_in_seconds: 60 * 60,
  });

  return {
    token,
    isInterviewer,
    currentUser: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      imageUrl: user.imageUrl,
    },
    booking: {
      id: booking.id,
      interviewer: booking.interviewer,
      interviewee: booking.interviewee,
      categories: booking.interviewer.categories,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    },
  };
};

export const generateFeedbackAction = async ({ bookingId }) => {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      interviewer: {
        select: { id: true, clerkUserId: true, name: true, categories: true },
      },
      interviewee: {
        select: { id: true, clerkUserId: true, name: true },
      },
      feedback: true,
    },
  });

  if (!booking) throw new Error("Booking not found");

  const isInterviewer = booking.interviewer.clerkUserId === user.id;
  const isInterviewee = booking.interviewee.clerkUserId === user.id;
  if (!isInterviewer && !isInterviewee) throw new Error("Forbidden");

  if (booking.feedback) {
    return { success: true, feedback: booking.feedback };
  }

  let transcriptText = "";

  // Attempt to fetch transcript from Stream SDK if available
  if (
    booking.streamCallId &&
    process.env.NEXT_PUBLIC_STREAM_KEY &&
    process.env.STREAM_SECRET_KEY
  ) {
    try {
      const streamClient = new StreamClient(
        process.env.NEXT_PUBLIC_STREAM_KEY,
        process.env.STREAM_SECRET_KEY,
      );
      const call = streamClient.video.call("default", booking.streamCallId);
      const { transcriptions } = await call.listTranscriptions();

      if (
        transcriptions &&
        transcriptions.length > 0 &&
        transcriptions[0].url
      ) {
        const transcriptRes = await fetch(transcriptions[0].url);
        const rawText = await transcriptRes.text();
        const lines = rawText
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((l) => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          })
          .filter((e) => e?.type === "speech");

        const speakerMap = {
          [booking.interviewer.clerkUserId]:
            booking.interviewer.name ?? "Interviewer",
          [booking.interviewee.clerkUserId]:
            booking.interviewee.name ?? "Interviewee",
        };

        if (lines.length > 0) {
          transcriptText = lines
            .map(
              (l) => `${speakerMap[l.speaker_id] ?? l.speaker_id}: ${l.text}`,
            )
            .join("\n");
        }
      }
    } catch (err) {
      console.error(
        "[generateFeedbackAction] Error fetching Stream transcript:",
        err,
      );
    }
  }

  const categories = booking.interviewer.categories?.join(", ") ?? "General";
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = transcriptText
    ? `You are an expert technical interviewer evaluating a mock interview.

Interview categories: ${categories}
Interviewer: ${booking.interviewer.name}
Candidate: ${booking.interviewee.name}

TRANSCRIPT:
${transcriptText}

Analyze the candidate's performance. Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
{
  "summary": "2-3 sentence overall summary of the session",
  "technical": "Assessment of technical knowledge and accuracy",
  "communication": "Assessment of clarity, structure, and communication style",
  "problemSolving": "Assessment of problem-solving approach and thought process",
  "recommendation": "HIRE / CONSIDER / NO_HIRE with a one-sentence reason",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT"
}`
    : `You are an expert technical interviewer evaluating a mock interview session.

Interview categories: ${categories}
Interviewer: ${booking.interviewer.name}
Candidate: ${booking.interviewee.name}

The live video session has concluded. Provide a comprehensive, constructive AI interview feedback evaluation for ${booking.interviewee.name} based on the ${categories} interview requirements.

Respond ONLY with a valid JSON object, no markdown, no backticks, no explanation:
{
  "summary": "2-3 sentence overall summary of the session",
  "technical": "Assessment of technical knowledge and accuracy",
  "communication": "Assessment of clarity, structure, and communication style",
  "problemSolving": "Assessment of problem-solving approach and thought process",
  "recommendation": "HIRE / CONSIDER / NO_HIRE with a one-sentence reason",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "overallRating": "POOR or AVERAGE or GOOD or EXCELLENT"
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const feedbackData = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

  const [feedback] = await db.$transaction([
    db.feedback.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        summary: feedbackData.summary,
        technical: feedbackData.technical,
        communication: feedbackData.communication,
        problemSolving: feedbackData.problemSolving,
        recommendation: feedbackData.recommendation,
        strengths: feedbackData.strengths,
        improvements: feedbackData.improvements,
        overallRating: feedbackData.overallRating,
      },
      update: {},
    }),
    db.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  const earnExists = await db.creditTransaction.findFirst({
    where: { bookingId: booking.id, type: "BOOKING_EARNING" },
  });
  if (!earnExists) {
    await db.creditTransaction.create({
      data: {
        userId: booking.interviewer.id,
        amount: booking.creditsCharged,
        type: "BOOKING_EARNING",
        bookingId: booking.id,
      },
    });
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");

  return { success: true, feedback };
};
