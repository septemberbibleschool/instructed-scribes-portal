import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// === SUPABASE CONFIG ===
const SUPABASE_URL = "https://zmqckvwqjkabkfjdzqji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptcWNrdndxamthYmtmamR6cWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTE4MzIsImV4cCI6MjA5ODAyNzgzMn0.kuX5mctiWdboF7kGtK9heiNJICVZJnKB-pBa5gneW7s";

// === EMAILJS CONFIG ===
const EMAILJS_SERVICE_ID  = "service_z54j2sl";
const EMAILJS_TEMPLATE_ID = "template_6qv4knn";
const EMAILJS_PUBLIC_KEY  = "ciRRbPFoYfxGiYQqs";

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize EmailJS
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

console.log("✅ Supabase + EmailJS loaded");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msg  = document.getElementById("msg");
  const btn  = document.getElementById("submitBtn");

  if (!form) {
    console.error("❌ Form not found!");
    return;
  }
  console.log("✅ Form found, attaching listener");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🚀 Submit clicked");

    btn.disabled = true;
    btn.textContent = "Submitting...";
    msg.textContent = "";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.subscribe_updates = formData.get("subscribe_updates") === "on";

    console.log("📤 Sending data:", data);

    try {
      // 1. Save to Supabase
      const { error } = await supabase.from("registrations").insert([data]);

      if (error) {
        console.error("❌ Supabase error:", error);
        msg.textContent = "❌ Error: " + error.message;
        msg.className = "text-center mt-3 text-sm text-red-600";
        btn.disabled = false;
        btn.textContent = "✨ Submit Registration ✨";
        return;
      }

      console.log("✅ Registration saved to database");

      // 2. Send confirmation email via EmailJS
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email:  data.email,
        full_name: data.full_name,
      })
      .then((response) => {
        console.log("📧 Email sent!", response.status, response.text);
      })
      .catch((err) => {
        console.warn("⚠️ Email failed:", err);
      });

      // 3. Redirect to success page
      window.location.href = "success.html";

    } catch (err) {
      console.error("❌ Unexpected error:", err);
      msg.textContent = "❌ Error: " + err.message;
      msg.className = "text-center mt-3 text-sm text-red-600";
      btn.disabled = false;
      btn.textContent = "✨ Submit Registration ✨";
    }
  });
});