
import { c } from "../ui/colors.mjs";
import os from "os";

export const meta = {
  name: "about",
  description: "Show version info",
  usage: "/about"
};

export async function execute(args, context) {
  // Gather System Info (Feature 1)
  const platform = os.platform();
  const release = os.release();
  const arch = os.arch();
  const cpus = os.cpus();
  const model = cpus[0] ? cpus[0].model : "Unknown CPU";
  const speed = cpus[0] ? cpus[0].speed : 0;
  const memory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const uptime = (os.uptime() / 3600).toFixed(1);
  const hostname = os.hostname();

  // Gather CLI Info (Feature 2)
  const version = "5.0.0"; // Should come from package.json ideally
  const nodeVersion = process.version;
  const pid = process.pid;

  // Rich ASCII Art (Feature 3)
  const banner = `
${c.pplx.teal}   ____                      _           _ _       
  |  _ \\ ___ _ __ _ __ | | _____  __(_) |_ _   _ 
  | |_) / _ \\ '__| '_ \\| |/ _ \\ \\/ /| | __| | | |
  |  __/  __/ |  | |_) | |  __/>  < | | |_| |_| |
  |_|   \\___|_|  | .__/|_|\\___/_/\\_\\|_|\\__|\\__, |
                 |_|                       |___/ ${c.reset}
  `;

  console.log(banner);
  console.log(`  ${c.dim}The Advanced AI Terminal Agent${c.reset}\n`);

  // Section 1: Application
  console.log(`${c.bold}${c.pplx.white}📦 Application Info${c.reset}`);
  console.log(`  ${c.pplx.teal}Version:${c.reset}      ${c.brightCyan}v${version}${c.reset}`);
  console.log(`  ${c.pplx.teal}Created by:${c.reset}   ${c.cyan}Google DeepMind${c.reset}`);
  console.log(`  ${c.pplx.teal}License:${c.reset}      ${c.cyan}MIT${c.reset}`);
  console.log(`  ${c.pplx.teal}Repository:${c.reset}   ${c.dim}https://github.com/google-deepmind/perplexity-cli-agent${c.reset}`);

  console.log();

  // Section 2: Environment
  console.log(`${c.bold}${c.pplx.white}🖥️  Environment${c.reset}`);
  console.log(`  ${c.pplx.teal}OS:${c.reset}           ${c.yellow}${platform} ${release} (${arch})${c.reset}`);
  console.log(`  ${c.pplx.teal}Hostname:${c.reset}     ${c.yellow}${hostname}${c.reset}`);
  console.log(`  ${c.pplx.teal}Node.js:${c.reset}      ${c.green}${nodeVersion}${c.reset}`);
  console.log(`  ${c.pplx.teal}Process ID:${c.reset}   ${c.dim}${pid}${c.reset}`);
  console.log(`  ${c.pplx.teal}Uptime:${c.reset}       ${uptime} hours`);

  console.log();

  // Section 3: Hardware
  console.log(`${c.bold}${c.pplx.white}⚙️  Hardware${c.reset}`);
  console.log(`  ${c.pplx.teal}CPU:${c.reset}          ${model}`);
  console.log(`  ${c.pplx.teal}Cores:${c.reset}        ${cpus.length} x ${speed}MHz`);
  console.log(`  ${c.pplx.teal}Memory:${c.reset}       ${freeMem}GB free / ${memory}GB total`);

  console.log();

  // Section 4: Easter Egg
  if (Math.random() > 0.9) {
    console.log(`${c.magenta}✨ Fun Fact: This CLI was built to empower developers!${c.reset}\n`);
  }
}
