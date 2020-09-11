#!/usr/bin/env node

"use strict";

const fs = require("fs");
const childProc = require("child_process");
const path = require("path");
const readline = require("readline");

const makeParentFolder = (parentFolderName) => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path.resolve(process.cwd(), `./${parentFolderName}`), (err) => {
      if (err) {
        console.log("Process exited -> \n", err);
        reject();
      } else {
        console.log("Created parent folder.");
        resolve();
      }
    });
  });
};

const makeFolders = (folders) => {
  if (folders.length === 0) {
    console.log("No folders were made in root directory.");
    return;
  }
  const makingFolders = childProc.spawn("mkdir", [...folders]);

  makingFolders.on("error", (err) => {
    console.log("Error occured while creating root folders");
  });
  makingFolders.on("close", (code) => {
    if (code !== 0) {
      console.log("Error occured while creating root folders");
    } else {
      console.log("Created all root folders.");
    }
  });
};

const npm_work = async (
  npmPackagesForServer,
  npmPackagesForClient,
  clientFolderName
) => {
  const npm_init = childProc.spawn("npm", ["init", "--y"]);
  npm_init.on("error", (err) => {
    console.log("Error occured in npm init");
  });
  npm_init.on("close", (code) => {
    if (code !== 0) {
      console.log("Error occured in npm init");
    } else {
      console.log("npm init successfull.");
    }

    const npm_client = childProc.spawn("npx", [
      "create-react-app",
      `./${clientFolderName}`,
    ]);
    npm_client.on("error", (err) => {
      console.log("Error occured in npx create-react-app");
    });
    npm_client.on("close", (code) => {
      if (code !== 0) {
        console.log("Error occured in npx create-react-app");
        return;
      }
      console.log("React app setup done.");
      if (npmPackagesForClient.length === 0) {
        console.log("No npm packages were added for react app.");
        return;
      }
      const npm_packages_client = childProc.spawn(
        "npm",
        ["i", ...npmPackagesForClient],
        {
          cwd: `./${clientFolderName}`,
        }
      );
      npm_packages_client.on("error", (err) => {
        console.log("npm i for client failed.");
      });
      npm_packages_client.on("close", (code) => {
        if (code !== 0) {
          console.log("npm i for react app failed due to invalid arguments.");
        } else {
          console.log("Installed npm packages for react app.");
        }
      });
    });

    const npm_packages_server = childProc.spawn("npm", [
      "i",
      "express",
      "mongoose",
      "dotenv",
      ...npmPackagesForServer,
    ]);
    npm_packages_server.on("error", (err) => {
      console.log("npm i for server failed.");
    });
    npm_packages_server.on("close", (code) => {
      if (code !== 0) {
        console.log("npm i for server failed due to invalid arguments.");
      } else {
        console.log("Installed npm packages for server.");
      }
    });
  });
};

const git_work = async (link) => {
  const git_init = childProc.spawn("git", ["init"]);
  git_init.on("close", (code) => {
    const git_remote = childProc.spawn("git", [
      "remote",
      "add",
      "origin",
      `${link}`,
    ]);
    git_remote.on("error", (err) => {
      console.log("git remote add origin failed.");
    });
    git_remote.on("close", (code) => {
      if (code !== 0) {
        console.log("git remote add origin failed.");
      } else {
        console.log("Git repository setup complete.");
      }
    });
  });
};

const setup_project = async (
  parentFolderName,
  rootFolders,
  clientFolderName,
  npmPackagesForServer,
  npmPackagesForClient,
  ifGit,
  gitlink
) => {
  await makeParentFolder(parentFolderName);

  process.chdir(`./${parentFolderName}`);
  console.log(`Switched working directory to ${process.cwd()}`);

  makeFolders(rootFolders);

  fs.copyFile(
    path.resolve(__dirname, "./default_files/server.js"),
    path.resolve(process.cwd(), "./server.js"),
    () => console.log("Created server.js in root directory.")
  );

  fs.copyFile(
    path.resolve(__dirname, "./default_files/.env"),
    path.resolve(process.cwd(), "./.env"),
    () => console.log("Created .env file.")
  );

  npm_work(npmPackagesForServer, npmPackagesForClient, clientFolderName);

  if (ifGit) {
    git_work(gitlink);
    fs.copyFile(
      path.resolve(__dirname, "./default_files/.gitignore"),
      path.resolve(process.cwd(), "./.gitignore"),
      () => console.log("Created .gitignore in root directory.")
    );
  }
};

const cli = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Name of your project folder\nDefaults to 'Project_Folder'\n",
    (ans) => {
      // ! Enter Project name
      const projectName =
        (ans.match(/[a-zA-Z-_0-9]+/gm) && ans.match(/[a-zA-Z-_0-9]+/gm)[0]) ||
        "Project_Folder";
      console.log("\x1b[36m%s\x1b[0m", `Project Name set as\n${projectName}`);
      rl.question(
        "npm packages for server.Other than express, mongoose, and dotenv.\nDefaults to []\n",
        (ans) => {
          // ! NPM Packages for server other than mongoose, express, and dotenv
          const server_packages = ans.match(/[a-zA-Z0-9-_@/]+/gm) || [];
          console.log(
            "\x1b[36m%s\x1b[0m",
            `npm packages for server(other than express, mongoose, and dotenv).\n${server_packages}`
          );
          rl.question(
            "Folders to make in root directory\nDefaults to []\n",
            (ans) => {
              // ! Folders to make in root directory
              const folders = ans.match(/[a-zA-Z-_0-9]+/gm) || [];
              console.log(
                "\x1b[36m%s\x1b[0m",
                `Folders to make in root directory are\n${folders}`
              );
              rl.question(
                "Folder for client side?\n(It would be made if it does not already exist in root directory)\nDefault to 'client'\n",
                (ans) => {
                  // ! Enter name for client folder
                  const clientFolder =
                    (ans.match(/[a-zA-Z-_0-9]+/gm) &&
                      ans.match(/[a-zA-Z-_0-9]+/gm)[0]) ||
                    "client";
                  console.log(
                    "\x1b[36m%s\x1b[0m",
                    `Client folder is set as\n${clientFolder}`
                  );
                  rl.question(
                    "npm packages for react app.\nDefaults to []\n",
                    (ans) => {
                      // ! NPM Packages for React app
                      const client_packages =
                        ans.match(/[a-zA-Z0-9-_@/]+/gm) || [];
                      console.log(
                        "\x1b[36m%s\x1b[0m",
                        `npm packages for react app\n${client_packages}`
                      );
                      rl.question(
                        "Do you want to add a github repo?\n(Enter 'yes' to init and add a github repo and anything else for otherwise)\n",
                        (ans) => {
                          // ! Enter if you want to setup a github repo
                          if (/yes/i.test(ans)) {
                            rl.question("Link to github repo.\n", (ans) => {
                              // ! Enter the link to github repo
                              const github_link = (ans && ans.trim()) || "";
                              console.log(
                                "\x1b[36m%s\x1b[0m",
                                `Link to github repo.\n${github_link}`
                              );
                              rl.close();
                              console.log(
                                "\x1b[32m%s\x1b[0m",
                                "\n\nSetting up the project for you...\n\n"
                              );

                              //* SETUP PROJECT
                              setup_project(
                                projectName,
                                folders,
                                clientFolder,
                                server_packages,
                                client_packages,
                                true,
                                github_link
                              );
                            });
                          } else {
                            rl.close();
                            console.log(
                              "\x1b[32m%s\x1b[0m",
                              "\n\nSetting up the project for you...\n\n"
                            );
                            setup_project(
                              projectName,
                              folders,
                              clientFolder,
                              server_packages,
                              client_packages,
                              false,
                              null
                            );
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

cli();
