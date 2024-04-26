import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Cookies from "js-cookie";
import { Content } from "./Content";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./Login";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const encodedUserInfo = Cookies.get("userinfo");
    if (encodedUserInfo) {
      const userInfo = JSON.parse(atob(encodedUserInfo));
      if (userInfo) {
        setLoggedIn(true);
      }
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <h1>Loading</h1>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute isLoggedIn={loggedIn} />}>
          <Route path="/" element={<Content />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
