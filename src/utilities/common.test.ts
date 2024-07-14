import { retry } from "./common";

test("retry.toPass.01", async () => {
  const fn = jest.fn();
  fn.mockRejectedValueOnce(new Error("First failure"));
  fn.mockRejectedValueOnce(new Error("Second failure"));
  fn.mockResolvedValueOnce("Third success");
  const result = await retry(fn, 1, 3);
  expect(result).toBe("Third success");
  expect(fn).toHaveBeenCalledTimes(3);
}, 4000);

test("retry.toPass.02", async () => {
  const fn = jest.fn();
  fn.mockResolvedValue("First success");
  const result = await retry(fn);
  expect(result).toBe("First success");
  expect(fn).toHaveBeenCalledTimes(1);
}, 4000);

test("retry.toFail.01", async () => {
  const fn = jest.fn();
  fn.mockRejectedValue(new Error("Always fails"));
  await expect(retry(fn, 1, 2)).rejects.toThrow("Always fails");
  expect(fn).toHaveBeenCalledTimes(2);
}, 4000);
