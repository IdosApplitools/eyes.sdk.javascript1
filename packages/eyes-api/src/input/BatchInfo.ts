import * as utils from '@applitools/utils'

export type BatchInfo = {
  id?: string
  name?: string
  sequenceName?: string
  startedAt?: Date | string
  notifyOnCompletion?: boolean
}

export class BatchInfoData implements Required<BatchInfo> {
  private _batch: BatchInfo = {} as any

  constructor()
  constructor(batch?: BatchInfo)
  constructor(name?: string, startedAt?: Date | string, id?: string)
  constructor(batchOrName?: BatchInfo | string, startedAt?: Date | string, id?: string) {
    if (!batchOrName) return this
    if (utils.types.isString(batchOrName)) {
      return new BatchInfoData({name: batchOrName, id, startedAt: startedAt})
    }
    this.id = batchOrName.id ?? utils.general.getEnvValue('BATCH_ID')
    this.name = batchOrName.name ?? utils.general.getEnvValue('BATCH_NAME')
    this.sequenceName = batchOrName.sequenceName ?? utils.general.getEnvValue('BATCH_SEQUENCE', 'string')
    this.startedAt = batchOrName.startedAt ?? new Date()
    this.notifyOnCompletion =
      batchOrName.notifyOnCompletion ?? utils.general.getEnvValue('BATCH_NOTIFY', 'boolean') ?? false
  }

  get id(): string {
    return this._batch.id
  }
  set id(id: string) {
    utils.guard.isString(id, {name: 'id', strict: false})
    this._batch.id = id
  }
  getId(): string {
    return this.id
  }
  setId(id: string): this {
    this.id = id
    return this
  }

  get name(): string {
    return this._batch.name
  }
  set name(name: string) {
    utils.guard.isString(name, {name: 'name', strict: false})
    this._batch.name = name
  }
  getName(): string {
    return this.name
  }
  setName(name: string): this {
    this.name = name
    return this
  }

  get sequenceName(): string {
    return this._batch.sequenceName
  }
  set sequenceName(sequenceName: string) {
    utils.guard.isString(sequenceName, {name: 'sequenceName', strict: false})
    this._batch.sequenceName = sequenceName
  }
  getSequenceName(): string {
    return this.sequenceName
  }
  setSequenceName(sequenceName: string): this {
    this.sequenceName = sequenceName
    return this
  }

  get startedAt(): Date | string {
    return this._batch.startedAt
  }
  set startedAt(startedAt: Date | string) {
    this._batch.startedAt = new Date(startedAt)
  }
  getStartedAt(): Date | string {
    return this.startedAt
  }
  setStartedAt(startedAt: Date | string): this {
    this.startedAt = startedAt
    return this
  }

  get notifyOnCompletion(): boolean {
    return this._batch.notifyOnCompletion
  }
  set notifyOnCompletion(notifyOnCompletion: boolean) {
    utils.guard.isBoolean(notifyOnCompletion, {name: 'notifyOnCompletion', strict: false})
    this._batch.notifyOnCompletion = notifyOnCompletion
  }
  getNotifyOnCompletion(): boolean {
    return this.notifyOnCompletion
  }
  setNotifyOnCompletion(notifyOnCompletion: boolean): this {
    this.notifyOnCompletion = notifyOnCompletion
    return this
  }

  /** @internal */
  toObject(): BatchInfo {
    return this._batch
  }

  /** @internal */
  toJSON(): BatchInfo {
    return utils.general.toJSON(this._batch)
  }

  /** @internal */
  toString() {
    return utils.general.toString(this)
  }
}
