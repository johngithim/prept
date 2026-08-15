import React from "react";
import { getCallData } from "../../../../actions/call";
import { toast } from "sonner";
import { notFound, redirect } from "next/navigation";
import CallRoom from "../../../../components/CallRoom";

const Page = async ({ params }) => {
  const { callId } = await params;
  const result = await getCallData(callId);

  if (result.error === "Unauthorized") {
    toast.error("You must be signed in to access this call.");
    redirect("/");
  }
  if (result.error === "call not found") {
    toast.error("This call does not exist");
    notFound();
  }
  if (result.error === "Forbidden") {
    toast.error("You don't have permission to access this call.");
    redirect("/");
  }
  const { token, isInterviewer, currentUser, booking } = result;
  return (
    <CallRoom
      callId={callId}
      token={token}
      apiKey={process.env.NEXT_PUBLIC_STREAM_KEY}
      currentUser={currentUser}
      booking={booking}
      isInterviewer={isInterviewer}
    />
  );
};
export default Page;
