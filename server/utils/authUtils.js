import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import env from "../config/env.js";

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    }
  );
};

export {
  hashPassword,
  comparePassword,
  generateToken,
};