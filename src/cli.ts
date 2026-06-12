import { cac } from "cac";

const cli = cac("myspec");

cli.help();
cli.version("0.1.0");
cli.parse();
