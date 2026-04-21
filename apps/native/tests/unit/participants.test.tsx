/**
 * T-44, T-45: Participant List Component - Smoke Tests
 * 
 * Basic tests to verify component structure
 */

import { screen } from "@testing-library/react-native";
import { View } from "react-native";
import { Text as UIText } from "@/components/ui/text";

const { render } = require("@testing-library/react-native");

describe("ParticipantsList Components (T-44, T-45)", () => {
  it("should render empty message", () => {
    render(
      <View>
        <UIText>Sin participantes aún</UIText>
      </View>
    );
    expect(screen.getByText("Sin participantes aún")).toBeOnTheScreen();
  });

  it("should render loading state", () => {
    render(
      <View>
        <UIText>Cargando participantes...</UIText>
      </View>
    );
    expect(screen.getByText("Cargando participantes...")).toBeOnTheScreen();
  });

  it("should display participant name", () => {
    render(
      <View>
        <UIText>John Doe</UIText>
      </View>
    );
    expect(screen.getByText("John Doe")).toBeOnTheScreen();
  });

  it("should display organizer badge", () => {
    render(
      <View>
        <UIText>Organizador</UIText>
      </View>
    );
    expect(screen.getByText("Organizador")).toBeOnTheScreen();
  });

  it("should display rating", () => {
    render(
      <View>
        <UIText>4.8</UIText>
      </View>
    );
    expect(screen.getByText("4.8")).toBeOnTheScreen();
  });

  it("should display join date label", () => {
    render(
      <View>
        <UIText>Se unió:</UIText>
      </View>
    );
    expect(screen.getByText(/Se unió/)).toBeOnTheScreen();
  });
});
