import { useState, useEffect } from "react";
import { UserContext } from "../lib/UserContext";
import { AuthContext } from "../lib/AuthContext";
import Router from "next/router";
import { magic } from "../lib/magic";
import Layout from "../components/layout";
import { ThemeProvider } from "@magiclabs/ui";
import "@magiclabs/ui/dist/cjs/index.css";
import { authToken } from "../lib/authapi";

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState();
  const [auth, setAuth] = useState();

  // If isLoggedIn is true, set the UserContext with user data
  // Otherwise, redirect to /login and set UserContext to { user: null }
  useEffect(() => {
    setUser({ loading: true });

    magic.user.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        magic.user.getMetadata().then((userData) => {
          setUser(userData);
          authToken(userData).then((token) => setAuth(token));
        });
      } else {
        Router.push("/login");
        setUser({ user: null });
      }
    });
  }, []);

  return (
    <ThemeProvider root>
      <UserContext.Provider value={[user, setUser]}>
        <AuthContext.Provider value={[auth, setAuth]}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </AuthContext.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default MyApp;
