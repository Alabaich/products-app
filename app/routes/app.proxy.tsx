// 1. IMPORT FROM 'react-router', not '@react-router/node'
import { data } from "react-router"; 
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  
  // Authenticate the request comes from Shopify
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const handle = url.searchParams.get("handle");

  if (!handle) {
    // 2. USE 'data()' INSTEAD OF 'json()' for custom status codes
    return data({ error: "Missing handle" }, { status: 400 });
  }

  // 3. IGNORE THE RED SQUIGGLY LINE HERE FOR NOW (See explanation below)
  const productData = await prisma.scrapedProduct.findUnique({
    where: { 
      handle: handle 
    },
    select: {
      bodyHtml: true
    }
  });

  if (!productData) {
    console.log(`Product not found in DB: ${handle}`);
    return { found: false };
  }

  // In React Router v7, you can just return the raw object for a 200 OK
  return {
    found: true,
    html: productData.bodyHtml
  };
};