import { render, screen } from "@testing-library/react-native";
import Index from "../index";

test("muestra el texto Agensible", async () => {
  await render(<Index />);
  expect(screen.getByText("Agensible")).toBeTruthy();
});
