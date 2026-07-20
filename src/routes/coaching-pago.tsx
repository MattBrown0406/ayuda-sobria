import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/coaching-pago")({
  component: Outlet,
});
