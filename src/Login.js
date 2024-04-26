import React from "react";

export default function Login() {
  return (
    <button onClick={() => (window.location.href = "/auth/login")}>
      Login
    </button>
  );
}
