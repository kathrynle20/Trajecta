import React from "react";
import "./profile.css";
import Profile from "../components/profile";

const ProfilePage = (props) => {
    return (
        <div>
            <Profile user={props.user} />
        </div>
    );
}