import { useContext } from "react";
import { UserContext } from "../lib/UserContext";
import { AuthContext } from "../lib/AuthContext";
import Loading from "../components/loading";
import Retool from "react-retool";

const Profile = () => {
  const [user] = useContext(UserContext);
  const [auth] = useContext(AuthContext);

  return (
    <>
      {user?.loading ? (
        <Loading />
      ) : (
        user?.issuer && (
          <>
            <div className="label">Email</div>
            <div className="profile-info">{user.email}</div>

            <div className="label">User Id</div>
            <div className="profile-info">{user.issuer}</div>
            <div className="label">User API Key</div>
            <div className="profile-info">{auth}</div>
            {auth && (
              <>
                <span id="api_key" className="hidden">
                  {auth}
                </span>
                <div className="retool">
                  <Retool url={process.env.NEXT_PUBLIC_RETOOL_APP} />
                </div>
              </>
            )}
          </>
        )
      )}
      <style jsx>{`
        .label {
          font-size: 12px;
          color: #6851ff;
          margin: 30px 0 5px;
        }
        .profile-info {
          font-size: 17px;
          word-wrap: break-word;
        }
        .hidden {
          display: none;
        }
        .retool {
          height: 60em;
          display: block;
        }
      `}</style>
    </>
  );
};

export default Profile;
