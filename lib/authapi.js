const axios = require("axios").default;

const checkAPIToken = async (user) => {
  return axios
    .post("/api/auth", {
      headers: {
        "Content-Type": "application/json",
      },
      data: user,
    })
    .then((response) => {
      if (response.data) return response.data.key;
    })
    .catch((error) => error.message);
};
export async function authToken(user) {
  if (!user.issuer) return "Invalid User";
  return checkAPIToken(user);
}
