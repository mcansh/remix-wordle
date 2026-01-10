import {
  redirect,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/node";
import { logout } from "~/session.server";

export const loader = async (_: LoaderFunctionArgs) => {
  return redirect("/");
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return logout(request);
};
