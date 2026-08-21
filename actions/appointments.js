"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "../lib/prisma";
import { StreamClient } from "@stream-io/node-sdk";

export const getIntervieweeAppointments = async () => {
  const user = await currentUser();
  if (!user) return [];

  const dbUser = await db.user.findUnique({ where: { clerkUserId: user.id } });
  if (!dbUser) return [];

  const appointments = await db.booking.findMany({
    where: { intervieweeId: dbUser.id },
    include: {
      interviewer: {
        select: {
          name: true,
          imageUrl: true,
          email: true,
          title: true,
          company: true,
          categories: true,
        },
      },
      feedback: true,
    },
    orderBy: { startTime: "desc" },
  });

  if (process.env.NEXT_PUBLIC_STREAM_KEY && process.env.STREAM_SECRET_KEY) {
    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_KEY,
      process.env.STREAM_SECRET_KEY
    );

    await Promise.all(
      appointments.map(async (booking) => {
        if (!booking.recordingUrl && booking.streamCallId) {
          try {
            const call = streamClient.video.call("default", booking.streamCallId);
            const { recordings } = await call.listRecordings();
            if (recordings && recordings.length > 0 && recordings[0].url) {
              const recordingUrl = recordings[0].url;
              booking.recordingUrl = recordingUrl;
              await db.booking.update({
                where: { id: booking.id },
                data: { recordingUrl },
              });
            }
          } catch (err) {
            console.error(
              `[getIntervieweeAppointments] Error fetching recording for ${booking.streamCallId}:`,
              err
            );
          }
        }
      })
    );
  }

  return appointments;
};

