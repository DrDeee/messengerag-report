import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isArray } from 'class-validator';
import { Request, Response } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import * as bcrypt from 'bcrypt';

const USER_FILE = process.env.USER_FILE || 'users.json';

function loadUsers() {
  try {
    const file = readFileSync(USER_FILE, {
      encoding: 'utf-8',
    });
    const users = JSON.parse(file);
    if (!isArray(users)) throw '';
    return users;
  } catch (e) {
    writeFileSync(USER_FILE, JSON.stringify([], null, 2));
    return [];
  }
}

import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  private readonly users: any[] = loadUsers();
  canActivate(context: ExecutionContext): boolean {
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('WWW-Authenticate', 'Basic realm="User Visible Realm"');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (
      !authHeader ||
      authHeader.split(' ').length != 2 ||
      authHeader.split(' ')[0].toLowerCase() !== 'basic'
    )
      throw new UnauthorizedException();
    const buff = Buffer.from(authHeader.split(' ')[1], 'base64');
    const decoded = buff.toString('utf-8');
    if (decoded.split(':').length != 2) throw new UnauthorizedException();
    const user = this.users.find((user) => user.name === decoded.split(':')[0]);
    if (user && bcrypt.compareSync(decoded.split(':')[1], user.password))
      return true;
    throw new UnauthorizedException();
  }
}
