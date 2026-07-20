import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mapa")({
  component: Outlet,
});
