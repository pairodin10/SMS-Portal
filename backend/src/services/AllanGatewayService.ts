import {
  CreateAllanGatewayInput,
  UpdateAllanGatewayInput,
} from '../dto/AllanGatewayDto';
import {
  AllanGateway,
  AllanGatewayRepository,
} from '../repositories/AllanGatewayRepository';

export class AllanGatewayService {
  constructor(private readonly repository = new AllanGatewayRepository()) {}

  getAll(): Promise<AllanGateway[]> {
    return this.repository.findAll();
  }

  getActive(): Promise<AllanGateway[]> {
    return this.repository.findActive();
  }

  create(input: CreateAllanGatewayInput, actorId: number | null): Promise<AllanGateway> {
    const { gatewayParams, ...gateway } = input;
    return this.repository.create(gateway, actorId, gatewayParams);
  }

  update(
    id: number,
    input: UpdateAllanGatewayInput,
    actorId: number | null,
  ): Promise<AllanGateway | null> {
    const { gatewayParams, ...gateway } = input;
    return this.repository.update(id, gateway, actorId, gatewayParams);
  }

  delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  deleteMany(ids: number[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }
}
