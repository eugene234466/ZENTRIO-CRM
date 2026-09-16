import React, { useState } from 'react'
import './login_register.css'

import { RiLockPasswordFill } from "react-icons/ri";
import { MdEmail } from "react-icons/md";
import { IoPersonSharp } from "react-icons/io5";

const Login_register = () => {

const [action,setAction] = useState("Login");

  return ( 
    <form className='container'>
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      <div className="inputs">
        {action==="Login"? <div></div>: <div className="input">
          <IoPersonSharp />
          <input type="text" placeholder="Name" />
        </div>}

        <div className="input">
          <MdEmail />
          <input type="email" placeholder= "Email" />
        </div>

        <div className="input">
          <RiLockPasswordFill className="icon" />
          <input type="password" placeholder= "Enter your password" />
        </div>
      </div> 

      {action==="Register"?<div></div>: <div className="forgot-password"> Forgot password? <span>Click Here</span></div>}

      <div className='submit-container'>
       <div className={action==="Login"?"submit gray":"submit"} onClick={()=>{setAction("Login")}}>Login</div>
       <div className={action==="Register"?"submit gray":"submit"} onClick={()=>{setAction("Register")}}>Register</div>
      </div>
    </form>
  )
}

export default Login_register