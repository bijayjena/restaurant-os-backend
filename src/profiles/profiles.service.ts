import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { QueryProfileDto } from './dto/query-profile.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createProfileDto: CreateProfileDto, currentUser: User): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { id: createProfileDto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenant_id !== currentUser.tenant_id) {
      throw new ForbiddenException('Cannot create profile for user in different tenant');
    }

    const profile = this.profileRepository.create(createProfileDto);
    return this.profileRepository.save(profile);
  }

  async findAll(queryDto: QueryProfileDto, currentUser: User): Promise<PaginatedResponse<Profile>> {
    const { page = 1, limit = 10, user_id } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('user.tenant_id = :tenant_id', { tenant_id: currentUser.tenant_id });

    if (user_id) {
      queryBuilder.andWhere('profile.user_id = :user_id', { user_id });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('profile.created_at', 'DESC')
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    if (profile.user.tenant_id !== currentUser.tenant_id) {
      throw new ForbiddenException('Cannot access profile from different tenant');
    }

    return profile;
  }

  async update(id: string, updateProfileDto: UpdateProfileDto, currentUser: User): Promise<Profile> {
    const profile = await this.findOne(id, currentUser);
    Object.assign(profile, updateProfileDto);
    return this.profileRepository.save(profile);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const profile = await this.findOne(id, currentUser);
    await this.profileRepository.remove(profile);
  }
}
