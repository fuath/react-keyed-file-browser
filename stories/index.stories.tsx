
// import { action } from "@storybook/addon-actions";
import { linkTo } from '@storybook/addons';
import { storiesOf } from "@storybook/react";
import * as React from "react";
import FileBrowser from "../src/components/FileBrowser/FileBrowser";


storiesOf("Uptick Component Library", module).add("To Libaray", () => (
  <div>
    <p>Component Library written in React </p>
    <div onClick={linkTo("Button")} />
  </div>
));

storiesOf("FileBrowser ", module)
  .add("Flat and simple", () => (
    <FileBrowser
      files={[
        {
          key: "cat.png",
          modified: 3,
          size: 1.5 * 1024 * 1024
        },
        {
          key: "kitten.png",
          modified: 100,
          size: 545 * 1024
        },
        {
          key: "elephant.png",
          modified: 40,
          size: 52 * 1024
        }
      ]}
    />
  ));
