# Quick Start Instructions

```
$ git clone https://github.com/thatapicompany/theauthapi-magiclink-retool-demo
$ cd theauthapi-magiclink-retool-demo
$ mv .env.example .env // For entering your Magic and TheAuthAPI keys as env variables
$ yarn install
$ yarn dev // Starts app at http://localhost:3000
```

## Environment Variables

```
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_...
MAGIC_SECRET_KEY=sk_live_...
AUTHAPI_ACCESS_KEY=live_access_...
AUTHAPI_PROJECT_ID=...
```

# Introduction

TheAuthAPI is a simple API key management tool. It supports creating an API key via an API call, passing a unique identifier and optionally any meta data you want to keep for later. Working with Magic you can authenticate a user and then pass their Magic unique identifier to TheAuthAPI to generate a new key. This key can be tested for validation from any other app you wish to use (e.g. Retool).

Magic is a passwordless authentication SDK that lets you plug and play different auth methods into your app. It supports passwordless email login via magic links, social login (such as Login with Google), and WebAuthn (a protocol that lets users authenticate a hardware device using either a YubiKey or fingerprint). This demo app will walk through implementing magic link and social logins.

## File Structure

```txt
├── README.md
├── components
│   ├── email-form.js
│   ├── header.js
│   ├── layout.js
│   ├── loading.js
│   └── social-logins.js
├── lib
│   ├── UserContext.js
│   └── magic.js
│   └── AuthContext.js
│   └── auth.js
├── package.json
├── pages
│   ├── _app.js
│   ├── _document.js
│   ├── api
│   │   └── login.js
│   │   └── auth.js
│   ├── callback.js
│   ├── index.js
│   ├── login.js
│   └── profile.js
├── public
│   └── (images)
└── yarn.lock
```

## TheAuthAPI

Head to [theauthapi.com](https://theauthapi.com) and create a new account. Set up a new project and copy your Access Key and Project ID values into `.env` as `AUTHAPI_ACCESS_KEY` and `AUTHAPI_PROJECT_ID`.

Also, set up a spare test key for your retool app to fallback to while you're developing.

## Demo Retool App

_VIDEO COMING SOON_

In your [retool.com](https://Retool.com) app, create a new `parentWindow` resource with the selector `#api_key`. You can enter the test key you generated in TheAuthAPI dashboard.

Create a new API `GET` resource called `testAPIKey` pointing to `https://api.theauthapi.com/api-keys/{{getAPIKeyToken.data}}`
with the header `x-api-key : [Access Key]`

Create a new piece of JS code called `authenticateApp` to collect your API token from the parent window and test the API. This is the key piece of logic to secure your app when you share it publicly.

```js
(() => {
  testAPIKey.trigger({
    additionalScope: {
      api_key: getAPIKeyToken.data,
    },
    // You can use the argument to get the data with the onSuccess function
    onSuccess: function (data) {
      validationText.setValue("API KEY IS VALID"); // Example of a valid response
      secureContent.setShowBody(true); // Show the app
    },
    onFailure: function (err) {
      validationText.setValue("API KEY IS NOT VALID"); // Example of an error response
      secureContent.setShowBody(false); // Hide the app from the user
    },
  });
})();
```

When you're ready to share private access to your app, click 'Share' > 'Public' > 'Enable public access'. Copy the URL and paste it into your `.env` as the `NEXT_PUBLIC_RETOOL_APP` value.

## Magic Setup

Your Magic setup will depend on what login options you want. For magic links, minimal setup is required. For social logins, follow their [**documentation**](https://magic.link/docs#social-logins) for instructions.

Once you have social logins configured (if you're using those), enter your Publishable Key and Test Secret Key from Magic's dashboard as the `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` and `MAGIC_SECRET_KEY` values in your `.env`.

# Client

## Keeping Track of the User

This example app will keep track of the logged in user by using React's `useContext` hook. Inside `_app.js`, wrap the entire app in the `<UserContext.Provider>` so all child components down the component tree have access to see if the user is logged in or not (`UserContext` is exported from `lib/UserContext`). Once a user logs in with Magic, unless they log out, they'll remain logged in for 7 days until their session expires.

```js
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
  <UserContext.Provider value={[user, setUser]}>
    <AuthContext.Provider value={[auth, setAuth]}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthContext.Provider>
  </UserContext.Provider>
);
```

## Magic Link Auth

In `pages/login.js`, handle `magic.auth.loginWithMagicLink()` which is what triggers the magic link to be emailed to the user. It takes an object with two parameters, `email` and an optional `redirectURI`. Magic allows you to configure the email link to open up a new tab, bringing the user back to your application. With the redirect in place, a user will get logged in on both the original and new tab. Once the user clicks the email link, send the `didToken` to the server endpoint at `/api/login` to validate it, and if the token is valid, set the `UserContext` and redirect to the profile page.

```js
async function handleLoginWithEmail(email) {
  // Trigger Magic link to be sent to user
  let didToken = await magic.auth.loginWithMagicLink({
    email,
    redirectURI: new URL("/callback", window.location.origin).href, // optional redirect back to your app after magic link is clicked
  });

  // Validate didToken with server
  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + didToken,
    },
  });

  if (res.status === 200) {
    // Set the UserContext to the now logged in user
    let userMetadata = await magic.user.getMetadata();
    await setUser(userMetadata);
    Router.push("/profile");
  }
}
```

## Social Logins

The social login implementation is similar. `magic.oauth.loginWithRedirect()` takes an object with a `provider`, and a required `redirectURI` for where to redirect back to once the user authenticates with the social provider and with Magic. In this case, the user will get redirected to `http://localhost:3000/callback`.

```js
function handleLoginWithSocial(provider) {
  magic.oauth.loginWithRedirect({
    provider, // Google, apple, etc
    redirectURI: new URL("/callback", window.location.origin).href, // Required redirect to finish social login
  });
}
```

## Handling Redirect

In the `/callback` page, check if the query parameters include a `provider`, and if so, finish the social login, otherwise, it’s a user completing the email login.

```js
// The redirect contains a `provider` query param if the user is logging in with a social provider
useEffect(() => {
  router.query.provider ? finishSocialLogin() : finishEmailRedirectLogin();
}, [router.query]);

// `getRedirectResult()` returns an object with user data from Magic and the social provider
const finishSocialLogin = async () => {
  let result = await magic.oauth.getRedirectResult();
  authenticateWithServer(result.magic.idToken);
};

// `loginWithCredential()` returns a didToken for the user logging in
const finishEmailRedirectLogin = () => {
  if (router.query.magic_credential)
    magic.auth
      .loginWithCredential()
      .then((didToken) => authenticateWithServer(didToken));
};

// Send token to server to validate
const authenticateWithServer = async (didToken) => {
  let res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + didToken,
    },
  });

  if (res.status === 200) {
    // Set the UserContext to the now logged in user
    let userMetadata = await magic.user.getMetadata();
    await setUser(userMetadata);
    Router.push("/profile");
  }
};
```

## Logout

Users also need to be able to log out. In `header.js`, add a `logout` function to end the user's session with Magic, clear the user from the UserContext, and redirect back to the login page.

```js
const logout = () => {
  magic.user.logout().then(() => {
    setUser({ user: null });
    Router.push("/login");
  });
};
```

# Server

## Validating the Auth Token (didToken)

In the `/api/login` route, simply verify the `DID token`, then send a `200` back to the client.

```js
export default async function login(req, res) {
  try {
    const didToken = req.headers.authorization.substr(7);
    await magic.token.validate(didToken);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Validating the Magic user with theauthapi.com

When a new user is granted access to your app, we need to generate a new access token for them. This token is then tied to this user for all future access. You can use this token to test access privileges across any app you control.

That's it! You now have a working Next.js app that includes Magic authentication for both magic links and social logins, connecting your Retool App.

```js
export default async function auth(req, res) {
  try {
    const issuer = req.body.data.issuer;
    const email = req.body.data.email;

    axios
      .get(
        "https://theauthapi-stage-lrjkgxnoba-uc.a.run.app/api-keys/?projectId=" +
          process.env.AUTHAPI_PROJECT_ID +
          "&customAccountId=" +
          issuer,
        {
          headers: {
            "x-api-key": process.env.AUTHAPI_ACCESS_KEY,
          },
        }
      )
      .catch((err) => {
        if (err.response.status === 404) {
          throw new Error(`${err.config.url} not found`);
        }
        throw err;
      })
      .then(async (response) => {
        if (response.data.length === 0) {
          const newKey = await createANewKey(issuer, email);
          res.status(200).json(newKey);
        }
        res.status(200).json(response.data[0]);
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
async function createANewKey(issuer, email) {
  const options = {
    headers: { "x-api-key": process.env.AUTHAPI_ACCESS_KEY },
  };

  return axios
    .post(
      "https://theauthapi-stage-lrjkgxnoba-uc.a.run.app/api-keys",
      {
        customAccountId: issuer,
        name: encodeURIComponent(email),
        projectId: process.env.AUTHAPI_PROJECT_ID,
      },
      options
    )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      if (err.response.status === 404) {
        throw new Error(`${err.config.url} not found`);
      }
      throw err;
    });
}
```

## Deploying to Vercel

Follow [this guide](https://magic.link/posts/magic-link-nextjs) for deploying to Vercel.
