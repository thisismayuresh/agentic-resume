export interface Command<Input, Output> {
  execute(input: Input): Promise<Output>;
}
