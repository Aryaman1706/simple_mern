#!/usr/bin/env node

"use strict";

const fs = require("fs");
const childProc = require("child_process");
const path = require("path");
const readline = require("readline");

const makeParentFolder = async (parentFolderName) => {
  fs.mkdir(path.resolve(__dirname, `./${parentFolderName}`), (err) => {
    if (err) {
      console.log("Process exited -> \n", err);
      process.exit(1);
    } else {
      console.log("Created parent folder.");
    }
  });
};

const makeFolders = async (folders) => {
  const makingFolders = childProc.spawn("mkdir", [...folders]);
  makingFolders.on("close", (code) => {
    console.log("Created all root folders.");
  });
};

const npm_work = async (
  npmPackagesForServer,
  npmPackagesForClient,
  clientFolderName
) => {
  const npm_init = childProc.spawn("npm", ["init", "--y"]);
  npm_init.on("close", (code) => {
    console.log("npm init successfull.");

    const npm_client = childProc.spawn("npx", [
      "create-react-app",
      `./${clientFolderName}`,
    ]);
    npm_client.on("close", (code) => {
      console.log("React app setup done.");
      const npm_packages_client = childProc.spawn(
        "npm",
        ["i", ...npmPackagesForClient],
        {
          cwd: `./${clientFolderName}`,
        }
      );

      npm_packages_client.on("close", (code) => {
        console.log("Installed npm packages for react app.");
      });
    });

    const npm_packages_server = childProc.spawn("npm", [
      "i",
      "express",
      "mongoose",
      "dotenv",
      ...npmPackagesForServer,
    ]);
    npm_packages_server.on("close", (code) => {
      console.log("Installed npm packages for server.");
    });
  });
};

const git_work = async (link) => {
  const git_init = childProc.spawn("git", ["init"]);
  git_init.on("close", (code) => {
    fs.copyFile(
      path.resolve(__dirname, "../defaultFiles/.gitignore"),
      path.resolve(__dirname, "./.gitignore"),
      () => console.log("Created .gitignore in root directory.")
    );

    const git_remote = childProc.spawn("git", [
      "remote",
      "add",
      "origin",
      `${link}`,
    ]);
    git_remote.on("close", (code) => {
      console.log("Git repository setup complete.");
    });
  });
};

const setup_project = async (
  parentFolderName = "parent",
  rootFolders = [],
  clientFolderName = "client",
  npmPackagesForServer = [],
  npmPackagesForClient = [],
  ifGit = false,
  gitlink = null
) => {
  await makeParentFolder(parentFolderName);

  process.chdir(`./${parentFolderName}`);
  console.log(`Switched working directory to ./${process.cwd}`);

  await makeFolders(rootFolders);

  fs.copyFile(
    path.resolve(__dirname, "./defaultFiles/server.js"),
    path.resolve(__dirname, "./server.js"),
    () => console.log("Created server.js in root directory.")
  );

  fs.copyFile(
    path.resolve(__dirname, "../defaultFiles/.env"),
    path.resolve(__dirname, "./.env"),
    () => console.log("Created .env file.")
  );

  npm_work(npmPackagesForServer, npmPackagesForClient, clientFolderName);

  if (ifGit) {
    git_work(gitlink);
  }
};

const cli = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Name of your project folder\n", (ans) => {
    // ! Enter Project name
    const projectName = ans.match(/[a-zA-Z-_0-9]+/gm)[0];
    console.log("===> Project Name set as\n===> ", projectName);
    rl.question(
      "npm packages for server.Other than express, mongoose, and dotenv.\n",
      (ans) => {
        // ! NPM Packages for server other than mongoose, express, and dotenv
        const server_packages = ans.match(/[a-zA-Z0-9-_@/]+/gm);
        console.log(
          "===> npm packages for server\n===> (other than express, mongoose, and dotenv)\n===> ",
          server_packages
        );
        rl.question("Folders to make in **root**\n", (ans) => {
          // ! Folders to make in root directory
          const folders = ans.match(/[a-zA-Z-_0-9]+/gm);
          console.log(
            "===> Folders to make in root directory are\n===> ",
            folders
          );
          rl.question(
            "Folder for client side?\n(It would be made if it does not already exist in root directory)\n",
            (ans) => {
              // ! Enter name for client folder
              const clientFolder = ans.match(/[a-zA-Z-_0-9]+/gm)[0];
              console.log("===> Client folder is set as\n===> ", clientFolder);
              rl.question("npm packages for react app.", (ans) => {
                // ! NPM Packages for React app
                const client_packages = ans.match(/[a-zA-Z0-9-_@/]+/gm);
                console.log(
                  "===> npm packages for react app\n===>",
                  client_packages
                );
                rl.question(
                  "Do you want to add a github repo?\n(Enter 'yes' to init and add a github repo and anything else for otherwise)\n",
                  (ans) => {
                    // ! Enter if you want to setup a github repo
                    if (/yes/i.test(ans)) {
                      rl.question("Link to github repo.\n", (ans) => {
                        // ! Enter the link to github repo
                        const github_link = ans.trim();
                        console.log(
                          "===> Link to github repo.\n===> ",
                          github_link
                        );
                        rl.close();
                        console.log(
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
                      console.log("\n\nSetting up the project for you...\n\n");
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
              });
            }
          );
        });
      }
    );
  });
};

cli();
