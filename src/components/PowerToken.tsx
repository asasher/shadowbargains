import type { Power } from "../types";
import { powerTokenImage } from "../data/images";

interface PowerTokenProps {
  power: Power;
  className?: string;
}

export function PowerToken({ power, className = "" }: PowerTokenProps) {
  return (
    <span aria-hidden="true" className={`power-token ${power.kind === "bane" ? "is-bane" : "is-boon"} ${className}`}>
      <img src={powerTokenImage(power.id)} alt="" draggable={false} />
    </span>
  );
}
