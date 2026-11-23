/** Local request types — kept here so the API has no workspace runtime dependency. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
