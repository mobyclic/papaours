/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />

declare namespace App {
  interface Locals {
    user?: {
      id?: string;
      email?: string;
      name?: string;
      is_admin?: boolean;
    };
  }
  // interface PageData {}
  // interface Error {}
  // interface Platform {}
}
