"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./env";
import { schemaTypes } from "./schema";

const singleton = ["siteSettings"];

export default defineConfig({
  name: "christhood",
  title: "Christhood Ministries",
  basePath: "/admin",
  projectId: projectId || "unconfigured",
  dataset,
  schema: { types: schemaTypes, templates: (t) => t.filter(({ schemaType }) => !singleton.includes(schemaType)) },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Manage the website")
          .items([
            S.listItem().title("Website settings").id("siteSettings").child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("announcement").title("Announcement banner"),
            S.documentTypeListItem("event").title("Events & camps"),
            S.documentTypeListItem("message").title("Messages & sermons"),
            S.divider(),
            S.documentTypeListItem("ministryPage").title("Ministry & programme pages"),
            S.documentTypeListItem("leader").title("Leaders"),
            S.documentTypeListItem("story").title("Member stories"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: { actions: (prev, { schemaType }) => (singleton.includes(schemaType) ? prev.filter(({ action }) => action !== "duplicate" && action !== "delete") : prev) },
});
