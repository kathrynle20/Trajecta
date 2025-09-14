import React from "react";
import "./Profile.css";
import Profile from "../components/Profile";

const ProfilePage = (props) => {
    return (
        <div>
            <Profile user={props.user} />
        </div>
    );
}