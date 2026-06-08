import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { RegisterUserDto } from './dto/register-user.dto';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }
  async create(createUserDto: CreateUserDto) {
    try {
      const isUserExist = await this.userRepository.findOne({
        where: {
          email: createUserDto.email
        }
      })

      if (isUserExist) {
        throw new ConflictException({ success: false, message: `Email "${createUserDto.email}" is already in use`, })
      } else {
        const hashedPassword = this.getHashPassword(createUserDto.password)
        const newuser = this.userRepository.create({
          ...createUserDto,
          password: hashedPassword,
        });

        await this.userRepository.save(newuser)

        return {
          success: true,
          message: "Create user successfully",
          userId: newuser.userId,
        }
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({ success: false, message: `Email "${createUserDto.email}" is already in use`, });
      }
      console.error('Error in create user:', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error from create user service',
      });
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    return hashSync(password, salt)
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  async register(dto: RegisterUserDto) {
    try {
      const { email, password, fullName } = dto;

      const isUserExist = await this.userRepository.findOne({
        where: { email: email },
      });

      if (isUserExist) {
        throw new ConflictException({ success: false, message: `Email "${email}" is already in use`, })
      } else {
        const hashedPassword = this.getHashPassword(password);
        const newUser = this.userRepository.create({
          email,
          fullName,
          password: hashedPassword,
        });
        await this.userRepository.save(newUser);
        return {
          success: true,
          message: 'User register success',
          userId: newUser.userId,
        };
      }

    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException({ success: false, message: `Email "${dto.email}" is already in use`, })
      }
      console.error('Error in register user:', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Error from register service',
      });
    }
  }

  async findOneByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email: email },
      select: {
        email: true,
        password: true,
        userId: true,
        fullName: true,
      },
    });
  }

  async updateUserToken(refresh_token: string, id: string) {
    return await this.userRepository.update({ userId: id }, { refreshToken: refresh_token });
  }

  async findUserByRefreshToken(refresh_token: string) {
    const user = await this.userRepository.findOne({
      where: { refreshToken: refresh_token },
    });

    if (!user) return null;
    return user;
  }
}
