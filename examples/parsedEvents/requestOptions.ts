// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

/**
 * Time-limit, cancel, and redirect Parsed Events requests.
 *
 * - `parsedEventsTimeoutMs` limits every request from the client. One that
 *   runs over rejects with an Error named "TimeoutError".
 * - A per-call `signal` cancels one request; it rejects with the signal's
 *   `reason`. `AbortSignal.timeout(ms)` gives a per-call limit.
 * - `parsedEventsUrl` sends requests to another host, such as a proxy. The API
 *   key is still appended as `api-key`.
 */
(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({
    apiKey,
    parsedEventsTimeoutMs: 30_000,
    // parsedEventsUrl: "https://proxy.example.com/v1/parsed-events",
  });

  // Stop paging when the user navigates away
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error("navigated away")), 5_000);

  try {
    let paginationToken: string | null | undefined;
    do {
      const page = await helius.parsedEvents.getTransactionHistory(
        {
          address: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
          paginationToken,
        },
        { signal: controller.signal }
      );
      page.data.forEach((r) => console.log(r.signature));
      paginationToken = page.paginationToken;
    } while (paginationToken);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error("A page took longer than 30s; retry it later");
    } else {
      console.error("Stopped:", error);
    }
  }
})();
