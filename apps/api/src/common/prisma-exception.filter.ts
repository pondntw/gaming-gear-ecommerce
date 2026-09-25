import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/** Maps common Prisma errors to HTTP responses instead of generic 500s. */
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientInitializationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(err: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientInitializationError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const send = (statusCode: number, message: string) => res.status(statusCode).json({ statusCode, message });

    if (err instanceof Prisma.PrismaClientInitializationError) {
      return send(HttpStatus.SERVICE_UNAVAILABLE, 'เชื่อมต่อฐานข้อมูลไม่ได้ ตรวจสอบ DATABASE_URL');
    }
    switch (err.code) {
      case 'P2025':
        return send(HttpStatus.NOT_FOUND, 'ไม่พบข้อมูล');
      case 'P2002':
        return send(HttpStatus.CONFLICT, 'ข้อมูลนี้มีอยู่แล้ว');
      case 'P2003':
        return send(HttpStatus.CONFLICT, 'ไม่สามารถดำเนินการได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่');
      default:
        return send(HttpStatus.INTERNAL_SERVER_ERROR, 'เกิดข้อผิดพลาดของฐานข้อมูล');
    }
  }
}
