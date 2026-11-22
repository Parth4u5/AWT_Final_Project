import type { Types } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
}

export interface IExample {
  title: string;
  code: string;
  createdBy: Types.ObjectId;
}
