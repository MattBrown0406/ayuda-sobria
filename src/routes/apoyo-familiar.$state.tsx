import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/apoyo-familiar/$state")({
  component: Outlet,
});
