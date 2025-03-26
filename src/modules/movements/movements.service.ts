import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { PrismaService } from 'nestjs-prisma'
import { ListMovemtsDto } from './dto/list-movemt.dto'
import { CreateMovementDto } from './dto/create-movement.dto'

@Injectable()
export class MovementsService {
  private readonly logger: Logger = new Logger(MovementsService.name)
  constructor(private readonly prismaService: PrismaService) {}

  async findAll(listMovemtsDto: ListMovemtsDto) {
    const { page = 1, size = 25 } = listMovemtsDto
    const [count, data, _totalBalance] = await this.prismaService.$transaction([
      this.prismaService.movement.count(),
      this.prismaService.movement.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: [{ createdAt: 'desc' }, { updatedAt: 'desc' }],
        include: {
          product: {
            omit: {
              categoryId: true,
              typeProductId: true,
              typePresentationId: true,
              updatedAt: true,
              createdAt: true,
            },
          },
          category: {
            select: {
              name: true,
              id: true,
            },
          },
          moventType: {
            select: {
              name: true,
              id: true,
            },
          },
          TypePresentation: {
            select: { id: true, name: true },
          },
          typeProduct: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        omit: {
          productId: true,
          categoryId: true,
          movementTypeId: true,
          typePresentationId: true,
          typeProductId: true,
        },
      }),
      this.prismaService.movement.aggregate({
        _sum: {
          balance: true,
        },
      }),
    ])
    if (!data || data.length === 0)
      return {
        status: HttpStatus.OK,
        count: 0,
        total_balance: 0,
        data,
      }
    return {
      status: HttpStatus.OK,
      count,
      total_balance: _totalBalance._sum.balance,
      data,
    }
  }
  async getMovementsByDateRange(startDate: Date, endDate: Date) {
    return this.prismaService.movement.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    })
  }

  async getProductStock(productId: string) {
    const lastMovement = await this.prismaService.movement.findFirst({
      where: { productId },
      orderBy: { date: 'desc' },
    })
    return lastMovement ? lastMovement.balance : 0
  }
  async upsertMovement(
    createMovementDto: CreateMovementDto,
    productMovementId?: string,
  ) {
    const {
      date,
      entry,
      exit,
      movementTypeId,
      description,
      categoryId,
      productId,
      typeProductId,
      typePresentationId,
    } = createMovementDto

    const lastMovement = await this.prismaService.movement.findFirst({
      where: { productId },
      orderBy: { date: 'desc' },
    })

    const lastBalance = lastMovement ? lastMovement.balance : 0
    const newBalance = lastBalance + (entry || 0) - (exit || 0)
    this.logger.debug(productId)
    if (newBalance < 0) {
      throw new HttpException(
        'No se puede registrar una salida mayor al stock disponible del producto.',
        HttpStatus.BAD_REQUEST,
      )
    }
    this.logger.debug(
      productMovementId
        ? `Updated MovementProduct ${productMovementId} `
        : `Created MovementProduct `,
    )
    const movement = await this.prismaService.movement.upsert({
      where: { id: productMovementId }, // Aquí puedes usar un identificador único si lo tienes
      update: {
        date: date || new Date(),
        entry,
        exit,
        balance: newBalance,
        moventType: { connect: { id: movementTypeId } },
        description,
        category: { connect: { id: categoryId } },
        product: { connect: { id: productId } },
        typeProduct: { connect: { id: typeProductId } },
        TypePresentation: { connect: { id: typePresentationId } },
      },
      create: {
        date: date || new Date(),
        entry,
        exit,
        balance: newBalance,
        moventType: { connect: { id: movementTypeId } },
        description,
        category: { connect: { id: categoryId } },
        product: { connect: { id: productId } },
        typeProduct: { connect: { id: typeProductId } },
        TypePresentation: { connect: { id: typePresentationId } },
      },
    })

    return {
      status: HttpStatus.OK,
      message: `${movementTypeId ? 'Movimiento actualizado' : 'Movimiento Creado'} exitosamente`,
      data: movement,
    }
  }

  async remove(id: string) {
    this.prismaService.movement.delete({ where: { id } })
    return {
      status: HttpStatus.OK,
      message: 'Movimiento eliminado exitosamente',
    }
  }
}
