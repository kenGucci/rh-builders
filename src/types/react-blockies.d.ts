declare module "react-blockies" {
  import { ComponentType } from "react";
  interface BlockiesProps {
    seed: string;
    size?: number;
    scale?: number;
    color?: string;
    bgcolor?: string;
    spotcolor?: string;
    className?: string;
  }
  const Blockies: ComponentType<BlockiesProps>;
  export default Blockies;
}
