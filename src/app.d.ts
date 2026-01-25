/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />

declare namespace App {
  interface Locals {
    user?: {
      id?: string;
      email?: string;
      name?: string;
    };
  }
  // interface PageData {}
  // interface Error {}
  // interface Platform {}
}
