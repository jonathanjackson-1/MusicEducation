import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AntivirusService {
  async scan(buffer: Buffer, fileName: string) {
    const signature = buffer.toString('utf8');
    if (signature.includes('EICAR')) {
      throw new BadRequestException(`File ${fileName} failed antivirus screening.`);
    }
  }
}
