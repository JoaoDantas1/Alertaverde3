import { describe, expect, it } from "vitest";
import { attentionLevel, findRegion, isInsideItabirito } from "./regions";

describe("nível de atenção comunitária", () => {
  it("0 denúncias = sem denúncias", () => expect(attentionLevel(0)).toBe("nenhuma"));
  it("1 denúncia = baixa", () => expect(attentionLevel(1)).toBe("baixa"));
  it("2 denúncias = baixa", () => expect(attentionLevel(2)).toBe("baixa"));
  it("3 denúncias = média", () => expect(attentionLevel(3)).toBe("media"));
  it("4 denúncias = média", () => expect(attentionLevel(4)).toBe("media"));
  it("5 denúncias = alta", () => expect(attentionLevel(5)).toBe("alta"));
  it("12 denúncias = alta", () => expect(attentionLevel(12)).toBe("alta"));
});

describe("regiões de Itabirito", () => {
  it("o centro da cidade cai na região central", () => {
    expect(findRegion(-20.2533, -43.8013)?.id).toBe("centro");
  });
  it("Belo Horizonte está fora da área aceita", () => {
    expect(isInsideItabirito(-19.9167, -43.9345)).toBe(false);
  });
});
