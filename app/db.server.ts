import { PrismaClient } from "@prisma/client";
import { NODE_ENV } from "./constants.server";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

declare global {
  // eslint-disable-next-line prefer-let/prefer-let
  var prismaClient: PrismaClient;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
export let db =
  NODE_ENV === "production"
    ? new PrismaClient()
    : global.prismaClient ?? (global.prismaClient = new PrismaClient());
