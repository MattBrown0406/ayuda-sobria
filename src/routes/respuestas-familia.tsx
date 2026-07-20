import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/respuestas-familia")({
  component: Outlet,
});
