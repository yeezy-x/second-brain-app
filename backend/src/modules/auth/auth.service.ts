import bcrypt from "bcrypt"
import { ApiError } from "../../utils/ApiError"
import { createUser, findUserByEmail } from "../user/user.repository"
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt"
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { findUserById } from "../user/user.repository";

export const signUpService=async(email:string, password:string)=>{
    const existingUser=await findUserByEmail(email)
    if(existingUser){
        throw new ApiError(400, "User already exists")
    }
    const hashedPassword=await bcrypt.hash(password, 10);
    const user=await createUser({
        email,
        password: hashedPassword
    })
    const refreshToken=generateRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save();
    return user;
}

export const loginService=async(email:string, password:string,)=>{
    const user=await findUserByEmail(email)
    if(!user){
        throw new ApiError(400, "Invalid email or password")
    }
    const isPasswordValid=await bcrypt.compare(password, user.password)
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid email or password")
    }
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    user.refreshToken = hashedRefreshToken;
    await user.save();
    return { accessToken, refreshToken };
}

export const refreshTokenService = async (token: string) => {
  if (!token) {
    throw new ApiError(401, "No refresh token");
  }
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
  const user = await findUserById(decoded.id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  const isMatch = await bcrypt.compare(token, user.refreshToken);
  if (!isMatch) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const newAccessToken = generateAccessToken(user._id.toString());
  const newRefreshToken = generateRefreshToken(user._id.toString());
  const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
  user.refreshToken = hashedNewRefreshToken;
  await user.save();
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutService = async (userId: string) => {
  const user = await findUserById(userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
};
