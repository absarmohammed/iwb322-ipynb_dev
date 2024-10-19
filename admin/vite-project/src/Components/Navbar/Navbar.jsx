import React from 'react';
import './Navbar.css';
import navlogo from '../../assets/admin-logo.png';
import navProfile from '../../assets/profile_icon.png';
const Navbar = () => {
    return (
        <div className='navbar'>
            <img src={navlogo} className='nav-logo' alt="" />

            <img src={navProfile} className='nav-profile' alt="" />
        </div>
    );
};

export default Navbar;