package com.bhaktichat.app.data.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONObject
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Stores the BhaktiChat bearer session encrypted with a non-exportable Android Keystore key. */
class SecureSessionStore(context: Context) {
    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun save(session: MobileSession) {
        val plaintext = JSONObject().apply {
            put("accessToken", session.accessToken)
            put("expiresAtMillis", session.expiresAtMillis)
            put("user", JSONObject().apply {
                put("id", session.user.id)
                put("email", session.user.email)
                put("name", session.user.name)
                put("phone", session.user.phone)
                put("image", session.user.image)
                put("isReviewer", session.user.isReviewer)
            })
        }.toString().toByteArray(Charsets.UTF_8)

        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        prefs.edit()
            .putString(KEY_CIPHERTEXT, cipher.doFinal(plaintext).toBase64())
            .putString(KEY_IV, cipher.iv.toBase64())
            .commit()
    }

    fun load(): MobileSession? = runCatching {
        val ciphertext = prefs.getString(KEY_CIPHERTEXT, null)?.fromBase64() ?: return null
        val iv = prefs.getString(KEY_IV, null)?.fromBase64() ?: return null
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, iv))
        val json = JSONObject(cipher.doFinal(ciphertext).toString(Charsets.UTF_8))
        val userJson = json.getJSONObject("user")
        MobileSession(
            accessToken = json.getString("accessToken"),
            expiresAtMillis = json.getLong("expiresAtMillis"),
            user = MobileUser(
                id = userJson.getString("id"),
                email = userJson.optNullableString("email"),
                name = userJson.optNullableString("name"),
                phone = userJson.optNullableString("phone"),
                image = userJson.optNullableString("image"),
                isReviewer = userJson.optBoolean("isReviewer", false)
            )
        )
    }.getOrElse {
        clear()
        null
    }

    fun clear() {
        prefs.edit().clear().commit()
    }

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE).run {
            init(
                KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setRandomizedEncryptionRequired(true)
                    .build()
            )
            generateKey()
        }
    }

    private fun ByteArray.toBase64(): String = Base64.encodeToString(this, Base64.NO_WRAP)
    private fun String.fromBase64(): ByteArray = Base64.decode(this, Base64.NO_WRAP)

    private fun JSONObject.optNullableString(key: String): String? =
        if (isNull(key)) null else optString(key).takeIf { it.isNotBlank() }

    private companion object {
        const val PREFS_NAME = "bhakti_mobile_auth"
        const val KEY_CIPHERTEXT = "session_ciphertext"
        const val KEY_IV = "session_iv"
        const val KEY_ALIAS = "bhaktichat_mobile_session_v1"
        const val ANDROID_KEYSTORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}
