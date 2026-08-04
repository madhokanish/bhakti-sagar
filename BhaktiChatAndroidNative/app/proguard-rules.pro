# No custom ProGuard rules needed for MVP.

# --- Razorpay Checkout ---------------------------------------------------------------
# Release builds are minified (isMinifyEnabled = true), and the SDK drives its checkout
# through a WebView JavaScript bridge plus reflective onPayment* callbacks. Without these
# rules the flow breaks only in release, where it is hardest to notice.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
    public void onPayment*(...);
}
