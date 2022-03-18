const axios = require("axios").default;

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
