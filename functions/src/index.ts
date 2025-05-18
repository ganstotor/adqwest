import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();

const STRIPE_CLIENT_ID = "ca_K25mRG1FRUEnwix6E4o71jx1JXwulM8r";
const STRIPE_SECRET_KEY = functions.config().stripe.secret;
const STRIPE_REDIRECT_URI =
  "https://us-central1-deployed-c1878.cloudfunctions.net/stripeOAuth/stripe-oauth-callback";

const stripe = require("stripe")(STRIPE_SECRET_KEY);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const router = express.Router();

router.post("/create-oauth-link", async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing user ID" });

  const state = uid;

  const url = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(STRIPE_REDIRECT_URI)}&state=${state}`;

  return res.json({ url });
});

router.get("/stripe-oauth-callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) return res.status(400).send("Missing code or state");

  try {
    const userRef = db.collection("users_driver").doc(state as string);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).send("User not found");
    }

    const userData = userDoc.data();

    if (userData?.stripeId) {
      console.log(`User ${state} уже подключён к Stripe с ID ${userData.stripeId}`);
      return res.redirect("adqwest://stripe-success");
    }

    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code: code as string,
    });

    const stripeUserId = tokenResponse.stripe_user_id;

    await userRef.update({
      stripeId: stripeUserId,
      stripeAccessToken: tokenResponse.access_token,
      stripeRefreshToken: tokenResponse.refresh_token,
    });

    return res.redirect("adqwest://stripe-success");
  } catch (err) {
    console.error("Stripe OAuth error:", err);
    return res.status(500).send("OAuth failed");
  }
});

router.post("/check-account-status", async (req, res) => {
  try {
    const { stripeId } = req.body;

    if (!stripeId) {
      return res.status(400).json({ error: "Missing stripeId" });
    }

    const account = await stripe.accounts.retrieve(stripeId);

    return res.json({
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "Unknown error occurred" });
  }
});

app.use(router);

export const stripeOAuth = functions.https.onRequest(app);


