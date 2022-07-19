import { LoaderFunction } from "@remix-run/node";
import { createUserSession } from "~/session.server";

export let loader: LoaderFunction = ({ request }) => {
  return createUserSession({
    request,
    redirectTo: "/",
    remember: true,
    userId: "cl5sljy9o0013b5is3ofpj7lr",
  });
};

export default function Login() {
  return <div>Login</div>;
}
